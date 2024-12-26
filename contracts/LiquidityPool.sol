// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LiquidityPool is ReentrancyGuard {
    address public token1;
    address public token2;
    uint256 public reserve1;
    uint256 public reserve2;

    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event AddLiquidity(address indexed provider, uint256 amount1, uint256 amount2);
    event RemoveLiquidity(address indexed provider, uint256 amount1, uint256 amount2);

    constructor(address _token1, address _token2) {

        require(_token1 != address(0), "Invalid token1 address");
        require(_token2 != address(0), "Invalid token2 address");

        token1 = _token1;
        token2 = _token2;
    }

    // Add liquidity to the pool
    function addLiquidity(uint256 amount1, uint256 amount2) external nonReentrant {

        require(amount1 > 0 && amount2 > 0, "Amounts must be greater than zero");

        IERC20(token1).transferFrom(msg.sender, address(this), amount1);
        IERC20(token2).transferFrom(msg.sender, address(this), amount2);

        reserve1 += amount1;
        reserve2 += amount2;

        emit AddLiquidity(msg.sender, amount1, amount2);
    }

    // Remove liquidity from the pool
    function removeLiquidity(uint256 liquidity) external nonReentrant {
        require(liquidity > 0, "Invalid liquidity amount");
        require(reserve1 > 0 && reserve2 > 0, "Insufficient reserves");


        uint256 amount1 = (liquidity * reserve1) / (reserve1 + reserve2);
        uint256 amount2 = (liquidity * reserve2) / (reserve1 + reserve2);

        reserve1 -= amount1;
        reserve2 -= amount2;

        IERC20(token1).transfer(msg.sender, amount1);
        IERC20(token2).transfer(msg.sender, amount2);

        emit RemoveLiquidity(msg.sender, amount1, amount2);
    }

    // Swap function using constant product formula (x * y = k)
    function swap(address tokenIn, uint256 amountIn) external nonReentrant returns (uint256 amountOut) {
        require(tokenIn == token1 || tokenIn == token2, "Invalid token");

        bool isToken1 = tokenIn == token1;
        address tokenOut = isToken1 ? token2 : token1;

        uint256 reserveIn = isToken1 ? reserve1 : reserve2;
        uint256 reserveOut = isToken1 ? reserve2 : reserve1;

        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");

        // Calculate output amount based on constant product formula with a 0.3% fee
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);

        // Update reserves
        if (isToken1) {
            reserve1 += amountIn;
            reserve2 -= amountOut;
        } else {
            reserve2 += amountIn;
            reserve1 -= amountOut;
        }

        // Transfer tokens
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    // View function to get the reserves of each token in the pool
    function getReserves() external view returns (uint256, uint256) {
        return (reserve1, reserve2);
    }
}
